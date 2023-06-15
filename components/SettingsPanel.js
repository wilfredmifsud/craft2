import { useEditor } from "@craftjs/core";
import {
  Box,
  Chip,
  Grid,
  Typography,
  Button as MaterialButton
} from "@material-ui/core";
import React, { useCallback } from "react";
import shortid from "shortid";

export const SettingsPanel = () => {
  const { actions, selected, query } = useEditor((state, query) => {
    const currentNodeId = state.events.selected;
    let selected;

    if (currentNodeId) {
      selected = {
        id: currentNodeId,
        name: state.nodes[currentNodeId].data.name,
        settings:
          state.nodes[currentNodeId].related &&
          state.nodes[currentNodeId].related.settings,
        isDeletable: query.node(currentNodeId).isDeletable()
      };
    }

    return {
      selected
    };
  });

  const getCloneTree = useCallback((idToClone) => {
    const tree = query.node(idToClone).toNodeTree();
    const newNodes = {};

    const changeNodeId = (node, newParentId) => {
      const newNodeId = shortid();
      const childNodes = node.data.nodes.map((childId) =>
        changeNodeId(tree.nodes[childId], newNodeId)
      );
      const linkedNodes = Object.keys(node.data.linkedNodes).reduce(
        (accum, id) => {
          const newNodeId = changeNodeId(
            tree.nodes[node.data.linkedNodes[id]],
            newNodeId
          );
          return {
            ...accum,
            [id]: newNodeId
          };
        },
        {}
      );

      newNodes[newNodeId] = {
        ...node,
        id: newNodeId,
        data: {
          ...node.data,
          parent: newParentId || node.data.parent,
          nodes: childNodes,
          linkedNodes
        }
      };
      return newNodeId;
    };

    const rootNodeId = changeNodeId(tree.nodes[tree.rootNodeId]);
    return {
      rootNodeId,
      nodes: newNodes
    };
  }, []);

  const handleClone = (e, id) => {
    e.preventDefault();
    const theNode = query.node(id).get();
    const parentNode = query.node(theNode.data.parent).get();
    const indexToAdd = parentNode.data.nodes.indexOf(id);
    const tree = getCloneTree(id);
    actions.addNodeTree(tree, parentNode.id, indexToAdd + 1);
  };

  return selected ? (
    <Box bgcolor="rgba(0, 0, 0, 0.06)" mt={2} px={2} py={2}>
      <Grid container direction="column" spacing={0}>
        <Grid item>
          <Box pb={2}>
            <Grid container alignItems="center">
              <Grid item xs>
                <Typography variant="subtitle1">Selected</Typography>
              </Grid>
              <Grid item>
                <Chip size="small" color="primary" label={selected.name} />
              </Grid>
            </Grid>
          </Box>
        </Grid>
        {selected.settings && React.createElement(selected.settings)}
        {selected.isDeletable ? (
          <MaterialButton
            variant="contained"
            color="default"
            onClick={() => {
              actions.delete(selected.id);
            }}
          >
            Delete
          </MaterialButton>
        ) : null}
        {selected ? (
          <MaterialButton
            variant="contained"
            color="default"
            onClick={(e) => {
              handleClone(e, selected.id);
            }}
          >
            Clone
          </MaterialButton>
        ) : null}
      </Grid>
    </Box>
  ) : null;
};
